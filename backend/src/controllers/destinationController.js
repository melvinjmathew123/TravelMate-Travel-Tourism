import Destination from "../models/Destination.js";

export async function getDestinations(req, res) {
  const q = req.query.search ? { $or: [
    { name: { $regex: req.query.search, $options: "i" } },
    { country: { $regex: req.query.search, $options: "i" } }
  ] } : {};
  res.json(await Destination.find(q).sort({ createdAt: -1 }));
}
export async function getDestination(req, res) {
  const item = await Destination.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Destination not found" });
  res.json(item);
}
export async function createDestination(req, res) { res.status(201).json(await Destination.create(req.body)); }
export async function updateDestination(req, res) {
  const item = await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Destination not found" });
  res.json(item);
}
export async function deleteDestination(req, res) {
  const item = await Destination.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Destination not found" });
  res.json({ message: "Destination deleted" });
}
