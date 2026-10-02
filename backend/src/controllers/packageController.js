import TravelPackage from "../models/Package.js";

export async function getPackages(req, res) {
  const q = req.query.search ? { title: { $regex: req.query.search, $options: "i" } } : {};
  res.json(await TravelPackage.find(q).populate("destination", "name country image").sort({ createdAt: -1 }));
}
export async function getPackage(req, res) {
  const item = await TravelPackage.findById(req.params.id).populate("destination");
  if (!item) return res.status(404).json({ message: "Package not found" });
  res.json(item);
}
export async function createPackage(req, res) { res.status(201).json(await TravelPackage.create(req.body)); }
export async function updatePackage(req, res) {
  const item = await TravelPackage.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Package not found" });
  res.json(item);
}
export async function deletePackage(req, res) {
  const item = await TravelPackage.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Package not found" });
  res.json({ message: "Package deleted" });
}
