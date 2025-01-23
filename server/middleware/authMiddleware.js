export const isAuthenticated = (req, res, next) => {
    console.log("Checking authentication... req.user:", req.user);
    
    if (req.isAuthenticated()) {
      return next();
    }
  
    res.status(401).json({ error: "Unauthorized" });
  };
  