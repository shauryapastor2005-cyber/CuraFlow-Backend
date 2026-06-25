import mongoose from "mongoose";
import { DB_NAME } from "../constants/index.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI,{
      dbName: DB_NAME
  }
    );
    console.log(
      `connection with database is SUCCESSFUL! 
       connection host: ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.error("MONGODB connection FAILED!", error);
    process.exit(1);
  }
};
export default connectDB;
