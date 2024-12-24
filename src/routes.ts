export default [
  {
    path: "/",
    file: './routes/App.tsx',
    children: [
      {
        path: "",
        file: './routes/UsersPage.tsx',
      },
      {
        path: ":userId",
        file: './routes/UserPage.tsx',
      },
      {
        path: ":userId/:collectionId",
        file: './routes/CollectionPage.tsx',
      },
      {
        path: ":userId/:collectionId/:itemId",
        file: './routes/ItemPage.tsx',
      },
      {
        path: ":userId/:collectionId/:itemId/label",
        file: './routes/WallLabelPage.tsx',
      },
    ]
  },
]
