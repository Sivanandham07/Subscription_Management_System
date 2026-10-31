import Link from "next/link";
import ProductForm from "../ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-6 max-w-3xl">
      <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
        ← Back to products
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">
        Add product
      </h1>
      <ProductForm />
      <p className="text-sm text-gray-500 mt-3">
        You can add variants after the product is created.
      </p>
    </div>
  );
}