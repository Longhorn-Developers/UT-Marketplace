import React from 'react'

const CategoryBrowse = async ({ params }: { params: { category: string } }) => {
  const { category } = params;

  return (
    <div>
      <h1>This is the Category Browse Page</h1>
      <p>Category: {category}</p>
    </div>
  );
};

export default CategoryBrowse;