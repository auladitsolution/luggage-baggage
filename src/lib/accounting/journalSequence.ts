import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

let inMemoryJournalCount = 0;

export async function getNextJournalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterId = `journal_${year}`;

  try {
    if (mongoose.connection.readyState === 1) {
      const counter = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const sequence = String(counter.seq).padStart(5, "0");
      return `JV-${year}-${sequence}`;
    }
  } catch (error) {
    console.error("Journal sequence DB error, using memory fallback", error);
  }

  inMemoryJournalCount++;
  const sequence = String(inMemoryJournalCount).padStart(5, "0");
  return `JV-${year}-${sequence}`;
}

