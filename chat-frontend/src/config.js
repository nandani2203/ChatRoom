// Change this to your Render backend URL after deploying
// During local dev: http://localhost:4000
// After Render deploy: https://your-app-name.onrender.com

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default BACKEND_URL;
