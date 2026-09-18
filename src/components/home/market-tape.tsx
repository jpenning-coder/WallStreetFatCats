import { marketTape } from "@/config/homepage";
import { cn } from "@/lib/cn";

export function MarketTape() {
  return (
    <aside
      aria-label="Sample market tape used for homepage presentation"
      className="market-tape"
    >
      <span className="sr-only">
        The values in this visual market tape are static presentation data and
        are not a live quotation service.
      </span>

      <div className="market-tape-track">
        {marketTape.map((item) => (
          <div key={item.symbol} className="market-tape-item">
            <span className="market-symbol">{item.symbol}</span>
            <span className="market-price">{item.price}</span>
            <span
              className={cn(
                "market-change",
                item.direction === "down" && "market-change-down",
                item.direction === "up" && "market-change-up",
                item.direction === "flat" && "market-change-flat",
              )}
            >
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}