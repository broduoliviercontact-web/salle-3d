// OCR Vision : pour chaque image, une ligne JSON {file, items:[{t, x, y, w, h}]} (coordonnées normalisées, origine en haut à gauche)
import Foundation
import Vision
import AppKit
var out: [[String: Any]] = []
for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  var items: [[String: Any]] = []
  for o in req.results ?? [] { guard let c = o.topCandidates(1).first else { continue }; let b = o.boundingBox
    items.append(["t": c.string, "x": b.minX, "y": 1 - b.maxY, "w": b.width, "h": b.height]) }
  out.append(["file": (path as NSString).lastPathComponent, "items": items])
}
let data = try! JSONSerialization.data(withJSONObject: out, options: [.prettyPrinted])
print(String(data: data, encoding: .utf8)!)
