import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  image: String,
  inclusions: [String],
  available: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Package", packageSchema);
