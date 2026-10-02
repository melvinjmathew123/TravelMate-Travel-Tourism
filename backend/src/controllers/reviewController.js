import Review from "../models/Review.js";

export async function createReview(req, res) {
  const packageId = req.params.packageId || req.body.packageId;
  const { rating, comment } = req.body;
  try {
    const review = await Review.create({ user: req.user._id, package: packageId, rating, comment });
    res.status(201).json(await review.populate("user", "name"));
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "You already reviewed this package" });
    throw e;
  }
}
export async function getReviews(req, res) {
  res.json(await Review.find({ package: req.params.packageId }).populate("user", "name").sort({ createdAt: -1 }));
}
