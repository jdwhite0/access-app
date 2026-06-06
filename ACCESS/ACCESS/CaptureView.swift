import SwiftUI

struct CaptureView: View {
    @State private var selectedType = "Asset"
    @State private var title = ""
    @State private var notes = ""
    @State private var submitted = false
    
    let types = ["Asset", "Project", "Idea", "System"]
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(alignment: .leading, spacing: 24) {
                
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Capture")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                    Text("Log something to your registry")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                }
                .padding(.top, 8)
                
                // Type Selector
                VStack(alignment: .leading, spacing: 8) {
                    Text("TYPE")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.gray)
                        .tracking(2)
                    
                    HStack(spacing: 8) {
                        ForEach(types, id: \.self) { type in
                            Button(action: { selectedType = type }) {
                                Text(type)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(selectedType == type ? .black : .white)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedType == type ? Color.white : Color.white.opacity(0.08))
                                    .cornerRadius(20)
                            }
                        }
                    }
                }
                
                // Title Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("TITLE")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.gray)
                        .tracking(2)
                    
                    TextField("Name this \(selectedType.lowercased())...", text: $title)
                        .font(.system(size: 16))
                        .foregroundColor(.white)
                        .padding(16)
                        .background(Color.white.opacity(0.06))
                        .cornerRadius(12)
                }
                
                // Notes Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("NOTES")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.gray)
                        .tracking(2)
                    
                    ZStack(alignment: .topLeading) {
                        if notes.isEmpty {
                            Text("Add context, links, details...")
                                .font(.system(size: 16))
                                .foregroundColor(.gray)
                                .padding(16)
                        }
                        TextEditor(text: $notes)
                            .font(.system(size: 16))
                            .foregroundColor(.white)
                            .scrollContentBackground(.hidden)
                            .padding(12)
                            .frame(height: 120)
                    }
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(12)
                }
                
                Spacer()
                
                // Submit Button
                Button(action: submitCapture) {
                    HStack {
                        Image(systemName: submitted ? "checkmark" : "plus")
                        Text(submitted ? "Logged" : "Log to Registry")
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.white)
                    .cornerRadius(14)
                }
                .disabled(title.isEmpty)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
    }
    
    func submitCapture() {
        guard !title.isEmpty else { return }
        submitted = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            title = ""
            notes = ""
            submitted = false
        }
    }
}
