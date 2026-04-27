import mongoose from "mongoose";

// Function to generate unique Booking ID
function generateBookingId() {
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return "UB" + Date.now() + random;
}

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },

    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
      validate: {
        validator: function (value) {
          return value >= new Date().setHours(0, 0, 0, 0);
        },
        message: "Booking date cannot be in the past",
      },
    },

    roomType: {
      type: String,
      enum: {
        values: ["single room", "family room", "duplex room"],
        message: "Invalid room type selected",
      },
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

// 🔥 Auto-generate Booking ID before saving
bookingSchema.pre("save", function (next) {
  if (!this.bookingId) {
    this.bookingId = generateBookingId();
  }
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;