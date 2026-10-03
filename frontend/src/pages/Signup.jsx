import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import API from "../api";
function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    if (!username || !email || !password) {
      alert("All fields required");
      return;
    }
    if (!email.includes("@")) {
      alert("Invalid email");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
const { data } = await API.post("/auth/signup", {
  name: username,
  email,
  password,
});      sessionStorage.setItem("user", JSON.stringify(data));
      alert("Form submitted ✅");
      navigate("/dashboard");
    } catch (err) {
      console.log(err.response?.data); // 👈 shows real backend error
      alert("Signup failed");
    }
  };

  return (
    <div className="h-screen bg-blue-100 flex items-center justify-center">

      <div className="w-[90%] h-[90%] flex rounded-3xl overflow-hidden shadow-lg bg-white">

        {/* LEFT */}
        <div className="w-1/2 p-10 flex flex-col">

          <h1 className="text-5xl font-bold mb-10">
            MacroC
          </h1>

          <h2 className="text-2xl mb-10">
            Sign Up
          </h2>

          <div className="flex flex-col gap-6">

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-[300px] border-b p-3 outline-none"
            />

            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-[300px] border-b p-3 outline-none"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-[300px] border-b p-3 outline-none"
            />

            <button
              onClick={handleSubmit}
              className="w-[300px] bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition"
            >
              Sign Up
            </button>

            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <span className="text-blue-500 cursor-pointer" onClick={() => navigate("/")}>
                Log in
              </span>
            </p>

          </div>
        </div>

        {/* RIGHT */}
        <div className="w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600"></div>

      </div>
    </div>
  );
}

export default Signup;