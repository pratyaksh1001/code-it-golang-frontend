import axios from "axios";
console.log(process.env.NEXT_PUBLIC_BACKEND_URL);

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://148.113.8.216:9000",
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
