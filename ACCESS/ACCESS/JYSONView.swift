import SwiftUI

struct JYSONView: View {
    @State private var messageText = ""
    @State private var messages: [JYSONMessage] = [
        JYSONMessage(text: "JYSON online. How can I help you today?", isUser: false)
    ]
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 0) {
                
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("JYSON")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        Text("AI Companion")
                            .font(.system(size: 14))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        Text("Online")
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 12)
                
                Divider()
                    .background(Color.white.opacity(0.1))
                
                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(messages) { message in
                                MessageBubble(message: message)
                                    .id(message.id)
                            }
                        }
                        .padding(20)
                    }
                    .onChange(of: messages.count) { _ in
                        if let last = messages.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
                
                // Input
                HStack(spacing: 12) {
                    TextField("Ask JYSON...", text: $messageText)
                        .font(.system(size: 15))
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(24)
                    
                    Button(action: sendMessage) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(messageText.isEmpty ? .gray : .white)
                    }
                    .disabled(messageText.isEmpty)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(Color.black)
            }
        }
    }
    
    func sendMessage() {
        let text = messageText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        messages.append(JYSONMessage(text: text, isUser: true))
        messageText = ""
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            messages.append(JYSONMessage(text: "Backend connection coming soon.", isUser: false))
        }
    }
}

struct JYSONMessage: Identifiable {
    let id = UUID()
    let text: String
    let isUser: Bool
}

struct MessageBubble: View {
    let message: JYSONMessage
    
    var body: some View {
        HStack {
            if message.isUser { Spacer() }
            Text(message.text)
                .font(.system(size: 15))
                .foregroundColor(message.isUser ? .black : .white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(message.isUser ? Color.white : Color.white.opacity(0.08))
                .cornerRadius(18)
            if !message.isUser { Spacer() }
        }
    }
}
