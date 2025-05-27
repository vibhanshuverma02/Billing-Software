
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StockItem } from "./barcode";// Replace with actual path

const favoriteItems: StockItem[] = [
  { id: "1", itemName: "Saree", hsn: "1234", rate: 1090, gstRate: 5, quantity: 1 },
  { id: "2", itemName: "Suit", hsn: "5678", rate: 1000, gstRate: 5, quantity: 1 },
  { id: "3", itemName: "Pant", hsn: "1357", rate: 600, gstRate: 5, quantity: 1 },
   { id: "4", itemName: "Lehenga", hsn: "1357", rate: 10000, gstRate: 5, quantity: 1 },
    { id: "5", itemName: "Dress", hsn: "1357", rate: 1000, gstRate: 5, quantity: 1 },
];

type BillingAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_MOBILE"; payload: string }
  | { type: "SET_SELLER"; payload: string };
export function QuickAddEnhancer({
  addItem,
  fields,
  inputRefs,
  dispatch,

}: {
  addItem: (item: StockItem) => void;
  fields: StockItem[];
  inputRefs: React.MutableRefObject<Array<{ quantity?: HTMLInputElement | null }>>;
   dispatch: React.Dispatch<BillingAction>;

}) {
  const tableRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
// Focus first item on mount
useEffect(() => {
  const firstButton = buttonRefs.current[0];
  if (firstButton) {
    firstButton.focus();
  }
}, []);

// Keep DOM focus in sync with focusedIndex
useEffect(() => {
  const btn = buttonRefs.current[focusedIndex];
  if (btn) btn.focus();
}, [focusedIndex]);


  // Auto-scroll to bottom when item is added
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }
  }, [fields.length]);

  // Auto-focus latest added quantity input
  useEffect(() => {
    const lastIndex = fields.length - 1;
    const input = inputRefs.current?.[lastIndex]?.quantity;
    if (input) input.focus();
  }, [fields.length , inputRefs]);


  
  // Keyboard shortcuts (new bill, print)
  useEffect(() => {
   const handleKey = (e: KeyboardEvent) => {
  if (e.key === "n") {
    e.preventDefault();

    // Blur current focused element to reset any trapped focus
    (document.activeElement as HTMLElement)?.blur();

    const newBillBtn = document.getElementById("new-bill-btn");
    if (newBillBtn) {
      newBillBtn.click();
    } else {
      console.warn("❌ new-bill-btn not found!");
    }
  }

      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        document.getElementById('submit-btn')?.click();
      }

      // Arrow key navigation for favorite items
      if (e.key === "ArrowRight") {
        setFocusedIndex((prev) => (prev + 1) % favoriteItems.length);
      }
      if (e.key === "ArrowLeft") {
        setFocusedIndex((prev) => (prev - 1 + favoriteItems.length) % favoriteItems.length);
      }
    if (e.key === "Enter" && document.activeElement === buttonRefs.current[focusedIndex]) {
  e.preventDefault(); // Prevent scanner or form submission
  const btn = buttonRefs.current[focusedIndex];
  if (btn) btn.click();
}

    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusedIndex]);

  // Restore last customer from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lastCustomer");
    if (saved) {
      const data = JSON.parse(saved);
      dispatch({ type: "SET_NAME", payload: data.name });
      dispatch({ type: "SET_MOBILE", payload: data.mobile });
      dispatch({ type: "SET_SELLER", payload: data.seller });
    }
  }, [dispatch]);

  return (
    <div className="my-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Add New Item from Favorites</h3>
      <div className="flex flex-wrap gap-2">
        {favoriteItems.map((item, index) => (
          <Button
            key={item.id}
            type="button"
           ref={(el: HTMLButtonElement | null) => {
              buttonRefs.current[index] = el;
            }}
            onClick={() => {
              const quantityStr = prompt(`Enter quantity for ${item.itemName}:`, "1");
                if (quantityStr === null) return;
              const rateStr = prompt(`Enter rate for ${item.itemName}:`, String(item.rate));
  if (rateStr === null) return;
              const quantity = Number(quantityStr);
              const rate = Number(rateStr);
              console.log("User input:", { quantity, rate });

              if (!isNaN(quantity) && !isNaN(rate) && quantity > 0 && rate >= 0) {
                addItem({
                  ...item,
                  quantity: Number(quantityStr),
  rate: Number(rateStr),
                });

                // Refocus current button for arrow key continuation
                setTimeout(() => {
      const btn = buttonRefs.current[focusedIndex];
      if (btn) btn.focus();
    }, 50);
  } else {
    alert("❌ Invalid input. Operation cancelled.");
  }
}}
          className={`text-xs px-2 py-1 ${
  focusedIndex === index ? 'bg-blue-500  font-semibold' : ''
}`}

            data-fav="true"
          >
            + {item.itemName}
          </Button>
        ))}
      </div>

      {/* Inject this inside your invoice table footer or after last row */}
      <div ref={tableRef} className="invoice-table mt-4 max-h-[300px] overflow-y-auto">
        {/* Your invoice table rows should go here */}
      </div>
    </div>
  );
}

// Usage:
// Place <QuickAddEnhancer ... /> at the bottom of your invoice table
// to show it only after the last row, inline with billing flow.
