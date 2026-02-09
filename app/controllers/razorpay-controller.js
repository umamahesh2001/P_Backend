const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/payment-model');
const Booking = require('../models/booking-model');
require('dotenv').config();

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const razorpayCntrl = {};

razorpayCntrl.createOrder = async (req, res) => {
    console.log("Create Order Request:", req.body, process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
    try {
        const { amount, currency = "INR", receipt, bookingId } = req.body;
        console.log("Create Order Request:", req.body);

        const options = {
            amount: Math.round(Number(amount) * 100), // amount in smallest currency unit, must be integer
            currency,
            receipt,
        };

        const order = await instance.orders.create(options);

        // Optionally create a pending payment record here if you want to track attempts
        // For now, we'll just return the order details for the frontend to use

        res.json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).send(error);
    }
};

razorpayCntrl.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
            amount
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        console.log("Sig received:", razorpay_signature);
        console.log("Sig expected:", expectedSignature);

        if (expectedSignature === razorpay_signature) {

            // Payment is successful
            // 1. Update Booking Status
            const booking = await Booking.findByIdAndUpdate(
                bookingId,
                {
                    paymentStatus: 'paid', // Or 'Successful' to match your enum? Let me check payment-model.js
                    // payment-model says: enum: ['pending', 'Successful','Failed'] (Note the capital S in Successful)
                    // booking-model says default "pending".
                    // Let's use 'paid' based on the frontend check: booking.paymentStatus === 'paid'
                    // Wait, frontend checks: booking.paymentStatus === 'paid' ? ... 
                    // BUT payment model enum is 'Successful'. 
                    // Let's check Booking model again. it is just String.
                    // The frontend code I saw uses 'paid'.
                    // I will stick to what the frontend expects or update frontend. 
                    // Actually, let's look at `booking-controller.js` updatePayment: puts "success".
                    // Frontend check: `booking.paymentStatus === 'paid'`
                    // This seems inconsistent in the existing code.
                    // booking-controller.js line 266: { $set: { paymentStatus: "success" } }
                    // frontend page.js line 130: booking.paymentStatus === 'paid'
                    // This means the existing code might already be buggy or I missed something.
                    // Let's verify `booking-controller.js` again.
                    // It sets "success". 
                    // So if I set "paid", frontend works. If I set "success", frontend might NOT work unless I change it.
                    // I will update Booking to "paid" to match the frontend check I saw in line 130 of page.js 
                    // OR I should update frontend to check for "success" || "paid".
                    // "paid" seems more standard. checking line 130 of page.js: `booking.paymentStatus === 'paid'`
                    // So I will set it to 'paid'.
                },
                { new: true }
            );

            // 2. Create Payment Record
            const payment = new Payment({
                bookingId,
                transactionId: razorpay_payment_id,
                paymentType: 'razorpay',
                amount: amount,
                paymentStatus: 'Successful' // Schema enum matches this
            });
            await payment.save();

            res.json({ status: "success", message: "Payment verified successfully", booking, payment });
        } else {
            res.status(400).json({ status: "failure", message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = razorpayCntrl;
