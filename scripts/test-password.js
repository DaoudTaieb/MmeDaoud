// Script pour tester le hashage des mots de passe
const bcrypt = require("bcryptjs")

async function testPassword() {
  const password = "admin123"
  const hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBVWEiA/6p2LW6"

  console.log("Testing password:", password)
  console.log("Against hash:", hash)

  const isValid = await bcrypt.compare(password, hash)
  console.log("Password valid:", isValid)

  // Créer un nouveau hash pour test
  const newHash = await bcrypt.hash(password, 12)
  console.log("New hash:", newHash)

  const isNewValid = await bcrypt.compare(password, newHash)
  console.log("New hash valid:", isNewValid)
}

testPassword()
