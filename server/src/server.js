import './setup.js';
import app from './app.js';
import { connectDB } from './setup.js';

const port = process.env.PORT || 4000;
await connectDB();
app.listen(port, () => console.log(`API listening on :${port}`));
