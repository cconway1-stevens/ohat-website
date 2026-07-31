"use client";

import { LinksQr, ShareLinksButtons, useLinksUrl } from "./share-links";

export function LinksQrPageBody() {
  const url = useLinksUrl();

  return (
    <div className="links-qr-body">
      <LinksQr size={260} />
      <ShareLinksButtons url={url} />
      <button
        type="button"
        className="make-game-toggle links-qr-print"
        onClick={() => window.print()}
      >
        Print this page
      </button>
    </div>
  );
}
