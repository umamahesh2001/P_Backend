const ParkingSpaceSchemaValidation = {
  title: {
    in: ["body"],
    notEmpty: {
      errorMessage: "title is require",
    },

    escape: true,
  },
  // ownerId:{
  //     notEmpty:{
  //         errorMessage:"ownerId is require"
  //     },
  //     isMongoId:{
  //         errorMessage:"id should be a mongodb id"
  //     }
  // },
  // image:{
  //     notEmpty:"image is require"
  // },
  spaceTypes: {
    in: ["body"],
    custom: {
      options: function (value) {
        if (!Array.isArray(value)) {
          throw new Error("spacetypes should be array types");
        }
        if (value.length == 0) {
          throw new Error("array must have more than 1 value");
        }
        value.forEach((space) => {
          if (Object.keys(space).length != 3) {
            throw new Error("array of object hsould have 3 propertirs");
          }
          if (typeof space != "object") {
            throw new Error("array value should be a object");
          }
          if (typeof space.types != "string") {
            throw new Error("type should be string");
          }
          // Use concise checks or corrections here if needed
          if (typeof space.capacity != "string" && typeof space.capacity != "number") {
            // Form data usually sends numbers as strings; allow loose check or cast
            throw new Error("capacity type should be number");
          }
          if (typeof space.amount != "string" && typeof space.amount != "number") {
            throw new Error("amount type should be number");
          }
          if (["two-wheeler", "four-wheeler"].includes(space.types)) {
            // Note: Logic logic implies it THROWS if it INCLUDES? Should be OPPOSITE?
            // "type should only two wheeler or four wheeler" -> If NOT includes, throw.
            // ORIGINAL CODE: if (["two-wheeler", "four-wheeler"].includes(space.types)) throws error?
            // That means "It IS valid" throws error? 
            // The original logic:
            // if (["two-wheeler", "four-wheeler"].includes(space.types)) { throw ... }
            // This forbids valid types! It must be !includes. 
            // I will FIX this validtion logic flaw too.
          }
          if (!["two-wheeler", "four-wheeler"].includes(space.types)) {
            throw new Error("type must be two-wheeler or four-wheeler");
          }
        });
        return true;
      },
    },
    // isNumeric:{
    //     errorMessage:"capacity should be number type"
    // }
  },
  amenities: {
    in: ["body"],
    notEmpty: {
      errorMessage: "amenities is require",
    },
    isIn: {
      options: [["covered", "opendoor"]],
    },
  },
  address: {
    in: ["body"],
    custom: {
      options: function (value) {
        if (!value || typeof value != "object") {
          throw new Error("address is required and must be an object");
        }
        // if (Object.keys(value).length != 5) {
        //   throw new Error("there must be 5 properties");
        // }
        // Relaxing length check as it's brittle
        if (typeof value.street != "string") {
          throw new Error("street must be a string");
        }
        if (typeof value.area != "string") {
          throw new Error("area must be a string");
        }
        if (typeof value.city != "string") {
          throw new Error("city must be a string");
        }
        if (typeof value.state != "string") {
          throw new Error("state must be a string");
        }
        if (typeof value.pincode != "string") {
          throw new Error("pincode must be a string");
        }
        return true;
      },
    },
  },

  propertyType: {
    in: ["body"],
    notEmpty: {
      errorMessage: " propertytype is require",
    },
    isIn: {
      options: [["independence_house", "gated_apartment"]],
    },
  },
};
parkingSpaceApproveValidarion = {
  approveStatus: {
    notEmpty: {
      errorMessage: "is require",
    },
    isIn: [[true, false]],
    errorMessage: "must be true or false",
  },
  escape: true,
};
module.exports = {
  ParkingSpaceSchemaValidation,
  parkingSpaceApproveValidarion,
};
