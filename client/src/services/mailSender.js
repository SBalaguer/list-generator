import axios from "axios";
// "proxy": ,

export const mailSender = async listPrice => {
  try {
    const response = await axios.post("/", { listPrice });
    return response.data.status;
  } catch (error) {
    throw error;
  }
};
