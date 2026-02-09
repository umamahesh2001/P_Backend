const { validationResult } = require("express-validator");
const Booking = require("../models/booking-model");
const axios = require("axios");
const _ = require("lodash");
const { isPointWithinRadius } = require("geolib");
const ParkingSpace = require("../models/parkingSpace-model");
const parkingSpaceCntrl = {};

function reverseLatLon(arr) {
  return [arr[1], arr[0]];
}

parkingSpaceCntrl.register = async (req, res) => {
  console.log(req.body, "reqbody")
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Pick only allowed fields from body
    const body = _.pick(req.body, [
      "title",
      "amenities",
      "spaceTypes",
      "propertyType",
      "description",
      "address",
      // Note: check logic of "address". If address is nested object, pick('address') takes the whole object.
    ]);

    const parkingSpace = new ParkingSpace(body);

    // Handle uploaded image
    if (req.file) {
      parkingSpace.image = req.file.filename;
    }
    parkingSpace.ownerId = req.user.id;
    if (parkingSpace.address) {
      const fullAddress = [
        parkingSpace.address.street,
        parkingSpace.address.area,
        parkingSpace.address.city,
        parkingSpace.address.state,
        parkingSpace.address.pincode,
        "India",
      ]
        .filter(Boolean)
        .join(", ");

      if (!fullAddress || fullAddress.length < 3) {
        console.warn("Invalid address, skipping geocoding");
      } else {

        const response = await axios.get(
          `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(fullAddress)}&limit=5&apiKey=${"4a35345ee9054b188d775bb6cef27b7c"}`
        );
        console.log(response, "responseatttttt");
        const features = response?.data?.features || [];

        if (features.length > 0) {
          const [lon, lat] = features[0].geometry.coordinates;
          parkingSpace.address.coordinates = [lon, lat];
        }
      }
    }


    await parkingSpace.save();
    res.status(201).json({
      message: "Parking space registered successfully",
      parkingSpace,
    });
  } catch (err) {
    console.error("Error while registering parking space:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

parkingSpaceCntrl.update = async (req, res) => {
  console.log(req.body, "reqbody")
  const id = req.params.id;
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    const parkingSpace = await ParkingSpace.findById({
      _id: id,
      ownerId: req.user.id,
    });
    if (!parkingSpace) {
      return res.status(404).json({ error: "parkingSpace not found for you" });
    }
    const body = _.pick(req.body, [
      "title",
      "amenities",
      "spaceTypes",
      "propertyType",
      "description",
      "address",
    ]);

    // Handle uploaded image for update
    if (req.file) {
      body.image = req.file.filename;
    }

    console.log(body, "reqbody");
    if (body.address) {
      const fullAddress = [
        body.address.street,
        body.address.area,
        body.address.city,
        body.address.state,
        body.address.pincode,
        "India",
      ]
        .filter(Boolean)
        .join(", ");

      if (!fullAddress || fullAddress.length < 3) {
        console.warn("Invalid address, skipping geocoding");
      } else {
        try {
          const response = await axios.get(
            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
              fullAddress
            )}&limit=5&apiKey=4a35345ee9054b188d775bb6cef27b7c`
          );

          const features = response?.data?.features || [];

          if (features.length > 0) {
            const [lon, lat] = features[0].geometry.coordinates;
            body.address.coordinates = [lon, lat];
          }
        } catch (error) {
          console.error("Geocoding error:", error.message);
        }
      }
    }
    const updatedSpace = await ParkingSpace.findOneAndUpdate(
      { _id: id },
      { $set: body },
      { new: true }
    );
    res.status(202).json({ updatedSpace, sucess: "updated successfully " });
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
};
parkingSpaceCntrl.mySpace = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.find({ ownerId: req.user.id });
    res.status(200).json(transformSpaces(parkingSpace, req));
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
};

parkingSpaceCntrl.approve = async (req, res) => {
  const id = req.params.id;
  try {
    // const admin = await User.findOne({ _id: req.user.id });
    // if (!admin) {
    //   res.status(401).json({ error: "unauthorised" });
    // }
    const space = await ParkingSpace.findOneAndUpdate(
      { _id: id },
      { $set: { approveStatus: true } },
      { new: true }
    );
    res.status(201).json(space);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
};

parkingSpaceCntrl.disable = async (req, res) => {
  const id = req.params.id;
  try {
    // const owner=await User.findOne({_id:req.user.id})
    // if(!owner){
    //     res.status(401).json({error:"unauthorised"})
    // }
    const parkingSpace = await ParkingSpace.findById({
      _id: id,
      ownerId: req.user.id,
    });
    console.log(parkingSpace);
    if (!parkingSpace) {
      res.status(404).json({ error: "parking Space not found" });
    }
    // const value=!parkingSpace.activeStatus
    const space = await ParkingSpace.findOneAndUpdate(
      { _id: id },
      { $set: { activeStatus: !parkingSpace.activeStatus } },
      { new: true }
    );
    res.status(201).json(space);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
};

parkingSpaceCntrl.remove = async (req, res) => {
  const id = req.params.id;
  try {
    const parkingSpace = await ParkingSpace.findOneAndDelete({
      _id: id,
      ownerId: req.user.id,
    });
    res.status(200).json(parkingSpace);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
};

// Helper to get base URL
const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}/uploads/`;

// Helper to transform parking space images to full URLs
const transformSpaces = (spaces, req) => {
  const baseUrl = getBaseUrl(req);
  // Ensure we are working with plain objects if possible, though Mongoose docs result might need toObject() if not lean()
  // Check if it's a Mongoose document array or single doc
  const list = Array.isArray(spaces) ? spaces : [spaces];

  const transformed = list.map(space => {
    // If it's a Mongoose document, convert to object to allow modification if strict
    const s = space.toObject ? space.toObject() : space;

    // Keep original 'image' as filename (for backward compatibility)
    // Add new 'imageUrl' with full path
    if (s.image) {
      if (s.image.startsWith('http')) {
        s.imageUrl = s.image;
      } else {
        s.imageUrl = `${baseUrl}${s.image}`;
      }
    }
    return s;
  });

  return Array.isArray(spaces) ? transformed : transformed[0];
};

parkingSpaceCntrl.list = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.find().populate("ownerId");
    console.log(parkingSpace);
    res.status(201).json(transformSpaces(parkingSpace, req));
  } catch {
    res.status(404).json({ error: "internal server error" });
  }
};

const transformToObj = (coordinates) => {
  return { latitude: coordinates[1], longitude: coordinates[0] };
};

parkingSpaceCntrl.findByLatAndLog = async (req, res) => {
  const { lat, log, radius } = req.query;
  console.log(lat, log, radius, req.query, 'reeeeee');

  if (!lat || !log || !radius) {
    return res.status(400).json({ error: "Latitude, longitude, and radius are required" });
  }

  const centerCoordinates = {
    latitude: lat,
    longitude: log,
  };
  try {
    const parkingSpace = await ParkingSpace.find({
      approveStatus: true,
      activeStatus: true,
    });
    console.log(centerCoordinates, "1");
    const filteredParkingSpace = parkingSpace.filter((ele) => {
      if (!ele.address || !ele.address.coordinates || ele.address.coordinates.length < 2) {
        return false;
      }
      const r = {
        latitude: parseFloat(Number(centerCoordinates.latitude)),
        longitude: parseFloat(Number(centerCoordinates.longitude)),
      };
      return isPointWithinRadius(
        transformToObj(ele.address.coordinates),
        r,
        radius * 1000
      );
    });

    if (filteredParkingSpace.length === 0) {
      return res.json([]);
    }

    res.json(transformSpaces(filteredParkingSpace, req));
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "internal server error" });
  }
};

// parkingSpaceCntrl.approvalList=async(req,res)=>{
//     const adminId=req.user.id
//     try{
// const admin=await User.findById(adminId)
// if(!admin){
//     res.status(404).json({error:"admin details not found"})
// }
// console.log("asdf")
// const approve=await ParkingSpace.find({approveStatus:false}).populate('ownerId')
// res.status(202).json(approve)

//     }catch(err){
//         res.status(500).json({error:"intnal server error"})
//     }
// }

module.exports = parkingSpaceCntrl;
