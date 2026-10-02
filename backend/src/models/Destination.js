import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, default: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80" },
  bestTime: String,
  featured: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Destination", destinationSchema);
