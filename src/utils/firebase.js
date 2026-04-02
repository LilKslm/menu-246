const firebaseConfig = {
  apiKey: "AIzaSyD98hOl3ZYtU8gtqZtg7cCxy6rvdeo5RYg",
  authDomain: "menu-246.firebaseapp.com",
  projectId: "menu-246",
  storageBucket: "menu-246.firebasestorage.app",
  messagingSenderId: "277266874950",
  appId: "1:277266874950:web:2ba4dd8f2f841639278047"
}

const COLLECTION = 'sharedRecipes'

// Single shared promise so initializeApp is never called twice
let _dbPromise = null
function getDb() {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const [{ initializeApp, getApps }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore'),
      ])
      // Reuse existing app if already initialized (e.g. hot reload)
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
      return getFirestore(app)
    })()
  }
  return _dbPromise
}

/**
 * Subscribe to shared recipes in real-time.
 * Calls onChange(recipes[]) immediately and on every update.
 * Returns an unsubscribe function.
 */
export function subscribeToSharedRecipes(onChange) {
  let cancelled = false
  let unsubFirestore = null

  getDb().then(async db => {
    if (cancelled) return
    const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore')
    const q = query(collection(db, COLLECTION), orderBy('name'))
    unsubFirestore = onSnapshot(
      q,
      snapshot => {
        if (cancelled) return
        const recipes = snapshot.docs.map(d => ({ ...d.data(), id: d.id }))
        onChange(recipes)
      },
      err => console.error('Firebase sync error:', err)
    )
  }).catch(err => console.error('Firebase init error:', err))

  return () => {
    cancelled = true
    if (unsubFirestore) unsubFirestore()
  }
}

/**
 * Save (add or update) a recipe to the shared database.
 */
export async function saveSharedRecipe(recipe) {
  const db = await getDb()
  const { doc, setDoc } = await import('firebase/firestore')
  await setDoc(doc(db, COLLECTION, recipe.id), recipe)
}

/**
 * Delete a recipe from the shared database.
 */
export async function deleteSharedRecipe(recipeId) {
  const db = await getDb()
  const { doc, deleteDoc } = await import('firebase/firestore')
  await deleteDoc(doc(db, COLLECTION, recipeId))
}
