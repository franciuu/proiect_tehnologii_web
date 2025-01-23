import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Note from "./pages/Note";
import CreateNote from "./pages/CreateNote";
import Groups from "./pages/Groups"; // Importă pagina grupurilor
import GroupDetails from "./pages/GroupDetails"; // Importă pagina detaliilor grupului

// Componentă pentru protejarea rutelor
function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/auth/user", { withCredentials: true })
      .then((response) => {
        setUser(response.data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta publică pentru login */}
        <Route path="/" element={<Login />} />

        {/* Layout general protejat */}
        <Route path="/" element={<Layout />}>
          {/* Rute protejate */}
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/create-note" element={<PrivateRoute><CreateNote /></PrivateRoute>} />
          <Route path="/notes/:id" element={<PrivateRoute><Note /></PrivateRoute>} />

          {/* Rute pentru grupuri de studiu */}
          <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
          <Route path="/groups/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
  