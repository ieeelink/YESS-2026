import logo from "../assets/YESS_Logo.svg";
import "./App.css";

export default function App() {
  return (
    <main className="stage">
      <div className="smoke smoke-a" aria-hidden="true" />
      <div className="smoke smoke-b" aria-hidden="true" />
      <div className="smoke smoke-c" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <img className="logo" src={logo} alt="IEEE YESS 2026" />
    </main>
  );
}
