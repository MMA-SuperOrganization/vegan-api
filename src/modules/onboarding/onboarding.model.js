import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    dummy: String,
  },
  { timestamps: true, versionKey: false },
);

export const OnboardingModel = mongoose.model("Onboarding", schema);
