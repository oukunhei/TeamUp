import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import IdeaHub from "@/pages/IdeaHub";
import IdeaDetail from "@/pages/IdeaDetail";
import Dashboard from "@/pages/Dashboard";
import SpaceList from "@/pages/SpaceList";
import SpaceDetail from "@/pages/SpaceDetail";
import CreateIdea from "@/pages/CreateIdea";
import EditIdea from "@/pages/EditIdea";

function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) fetchUser();
    else useAuthStore.setState({ isLoading: false });
  }, [fetchUser]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ideas" element={<IdeaHub />} />
        <Route path="/ideas/:id" element={<IdeaDetail />} />
        <Route path="/ideas/create" element={<CreateIdea />} />
        <Route path="/ideas/:id/edit" element={<EditIdea />} />
        <Route path="/spaces" element={<SpaceList />} />
        <Route path="/spaces/:id" element={<SpaceDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
