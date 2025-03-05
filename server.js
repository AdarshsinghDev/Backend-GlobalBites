require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

if (!SPOONACULAR_API_KEY) {
  console.error("❌ ERROR: Spoonacular API Key is missing! Add it to .env");
  process.exit(1);
}

const getIndianRecipes = async (ingredients) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch?query=indian&includeIngredients=${ingredients}&number=3&apiKey=${SPOONACULAR_API_KEY}`
    );
    return response.data.results.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
    }));
  } catch (error) {
    console.error("❌ ERROR fetching Indian recipes:", error.message);
    return [];
  }
};

const getInternationalRecipes = async (ingredients) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=3&apiKey=${SPOONACULAR_API_KEY}`
    );
    return response.data.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
    }));
  } catch (error) {
    console.error("❌ ERROR fetching international recipes:", error.message);
    return [];
  }
};

const getRecipeDetails = async (recipeId) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions?apiKey=${SPOONACULAR_API_KEY}`
    );

    if (!response.data.length) {
      return ["Step-by-step instructions not available."];
    }

    return response.data[0].steps.map((step) => `Step ${step.number}: ${step.step}`);
  } catch (error) {
    console.error("❌ ERROR fetching recipe details:", error.message);
    return ["Failed to fetch instructions."];
  }
};

app.post("/get-recipes", async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || ingredients.trim() === "") {
    return res.status(400).json({ error: "❌ Ingredients are required!" });
  }

  try {
    console.log(`🔹 Request received with ingredients: ${ingredients}`);

    const indianRecipes = await getIndianRecipes(ingredients);
    const internationalRecipes = await getInternationalRecipes(ingredients);
    const combinedRecipes = [...indianRecipes, ...internationalRecipes];

    if (combinedRecipes.length === 0) {
      return res.json({ recipes: ["No recipes found. Try different ingredients!"] });
    }

    res.json({ recipes: combinedRecipes });
  } catch (error) {
    console.error("❌ ERROR: Failed to fetch recipes:", error.message);
    res.status(500).json({ error: "❌ Failed to fetch recipes." });
  }
});

app.get("/get-recipe-details/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "❌ Recipe ID is required!" });
  }

  try {
    console.log(`🔹 Fetching details for recipe ID: ${id}`);
    const steps = await getRecipeDetails(id);
    res.json({ steps });
  } catch (error) {
    res.status(500).json({ error: "❌ Failed to fetch recipe details." });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
