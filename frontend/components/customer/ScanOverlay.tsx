function ScanOverlay() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 overflow-hidden rounded-md">
        <div className="scan-animation absolute left-0 w-full" />
      </div>
    </div>
  );
}

export default ScanOverlay;
