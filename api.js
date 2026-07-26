import axios from "axios";
console.log(process.env.NEXT_PUBLIC_BACKEND_URL);

const api = axios.create({
    baseURL: "http://127.0.0.1:9000" || "http://148.113.8.216:9000",
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
