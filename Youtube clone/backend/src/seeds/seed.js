import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import Subscription from "../models/Subscription.js";

dotenv.config();

const demoUsers = [
  {
    name: "Alice Creator",
    email: "alice@example.com",
    password: "password123",
    avatar: "https://i.pravatar.cc/200?img=32",
    bio: "Frontend and design tutorials"
  },
  {
    name: "Bob Dev",
    email: "bob@example.com",
    password: "password123",
    avatar: "https://i.pravatar.cc/200?img=13",
    bio: "Backend and architecture content"
  },
  {
    name: "Charlie Viewer",
    email: "charlie@example.com",
    password: "password123",
    avatar: "https://i.pravatar.cc/200?img=56",
    bio: "Tech learner and product builder"
  }
];

const sampleVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const sampleThumbs = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
];

const runSeed = async () => {
  await connectDB();

  const shouldClearOnly = process.argv.includes("--clear");

  await Promise.all([
    Subscription.deleteMany(),
    Comment.deleteMany(),
    Video.deleteMany(),
    User.deleteMany()
  ]);

  if (shouldClearOnly) {
    console.log("Database cleared.");
    await mongoose.connection.close();
    return;
  }

  const users = await User.insertMany(demoUsers);
  const [alice, bob, charlie] = users;

  const videos = await Video.insertMany([
    {
      title: "React 19 Crash Course",
      description: "Learn modern React patterns and best practices in one focused session.",
      videoUrl: sampleVideoUrl,
      thumbnailUrl: sampleThumbs[0],
      owner: alice._id,
      views: 245
    },
    {
      title: "Node.js API Architecture",
      description: "Build scalable Express APIs with clean controller-service structure.",
      videoUrl: sampleVideoUrl,
      thumbnailUrl: sampleThumbs[1],
      owner: bob._id,
      views: 189
    },
    {
      title: "MongoDB Indexing Explained",
      description: "Speed up your MongoDB queries with practical indexing examples.",
      videoUrl: sampleVideoUrl,
      thumbnailUrl: sampleThumbs[2],
      owner: bob._id,
      views: 132
    }
  ]);

  videos[0].likes = [bob._id, charlie._id];
  videos[1].likes = [alice._id];
  videos[2].dislikes = [charlie._id];
  await Promise.all(videos.map((video) => video.save()));

  await Comment.insertMany([
    {
      content: "Great explanation, thanks!",
      video: videos[0]._id,
      user: charlie._id
    },
    {
      content: "Could you make a part 2 on deployment?",
      video: videos[1]._id,
      user: alice._id
    }
  ]);

  await Subscription.insertMany([
    { subscriber: charlie._id, channel: alice._id },
    { subscriber: alice._id, channel: bob._id }
  ]);

  await User.findByIdAndUpdate(alice._id, { subscribersCount: 1 });
  await User.findByIdAndUpdate(bob._id, { subscribersCount: 1 });

  console.log("Seed complete.");
  console.log("Demo users:");
  console.log("alice@example.com / password123");
  console.log("bob@example.com / password123");
  console.log("charlie@example.com / password123");

  await mongoose.connection.close();
};

runSeed().catch(async (error) => {
  console.error(`Seed failed: ${error.message}`);
  await mongoose.connection.close();
  process.exit(1);
});
