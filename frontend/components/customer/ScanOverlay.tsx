function ScanOverlay() {
  return (
    <div className="relative aspect-square w-full">
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="scan-animation absolute left-0 w-full" />
      </div>
    </div>
  );
}

export default ScanOverlay;
