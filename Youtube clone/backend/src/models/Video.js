import mongoose from "mongoose";
import slugify from "slugify";

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    category: { type: String, default: "Entertainment" },
    duration: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

videoSchema.pre("validate", function generateSlug(next) {
  if (!this.title) return next();
  this.slug = `${slugify(this.title, { lower: true, strict: true })}-${this._id}`;
  return next();
});

const Video = mongoose.model("Video", videoSchema);
export default Video;
