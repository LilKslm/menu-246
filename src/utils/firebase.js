const firebaseConfig = {
  apiKey: "AIzaSyD98hOl3ZYtU8gtqZtg7cCxy6rvdeo5RYg",
  authDomain: "menu-246.firebaseapp.com",
  projectId: "menu-246",
  storageBucket: "menu-246.firebasestorage.app",
  messagingSenderId: "277266874950",
  appId: "1:277266874950:web:2ba4dd8f2f841639278047"
}

const COLLECTION = 'sharedRecipes'

// Lazy-initialize Firebase so it doesn't block the initial render
let _db = null
async function getDb() {
  if (_db) return _db
  const { initializeApp } = await import('firebase/app')
  const { getFirestore } = await import('firebase/firestore')
  const app = initializeApp(firebaseConfig)
  _db = getFirestore(app)
  return _db
}

/**
 * Subscribe to the shared recipe collection in real-time.
 * Calls onChange(recipes[]) immediately and on every update.
 * Returns an unsubscribe function.
 */
export function subscribeToSharedRecipes(onChange) {
  let unsub = () => {}
  ;(async () => {
    try {
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore')
      const db = await getDb()
      const q = query(collection(db, COLLECTION), orderBy('name'))
      unsub = onSnapshot(q, snapshot => {
        const recipes = snapshot.docs.map(d => ({ ...d.data(), id: d.id }))
        onChange(recipes)
      }, err => console.error('Firebase sync error:', err))
    } catch (err) {
      console.error('Firebase init error:', err)
    }
  })()
  // Return a function that calls unsub when available
  return () => unsub()
}

/**
 * Save (add or update) a recipe to the shared database.
 */
export async function saveSharedRecipe(recipe) {
  const { doc, setDoc } = await import('firebase/firestore')
  const db = await getDb()
  await setDoc(doc(db, COLLECTION, recipe.id), recipe)
}

/**
 * Delete a recipe from the shared database.
 */
export async function deleteSharedRecipe(recipeId) {
  const { doc, deleteDoc } = await import('firebase/firestore')
  const db = await getDb()
  await deleteDoc(doc(db, COLLECTION, recipeId))
}
