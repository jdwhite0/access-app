import SwiftUI

struct DashboardView: View {
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("ACCESS")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.white)
                            Text("jdwhite.access")
                                .font(.system(size: 14))
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Circle()
                            .fill(Color.white.opacity(0.1))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Text("JD")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                            )
                    }
                    .padding(.top, 8)
                    
                    // Stat Cards
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        StatCard(title: "Projects", value: "—", icon: "folder.fill")
                        StatCard(title: "Assets", value: "—", icon: "photo.stack.fill")
                        StatCard(title: "JYSON", value: "Active", icon: "waveform", accent: true)
                        StatCard(title: "Vaults", value: "—", icon: "lock.fill")
                    }
                    
                    // System Status
                    VStack(alignment: .leading, spacing: 12) {
                        Text("SYSTEM")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.gray)
                            .tracking(2)
                        
                        StatusRow(label: "Platform", status: "Online")
                        StatusRow(label: "Registry", status: "Connected")
                        StatusRow(label: "Billing", status: "Founder")
                    }
                    .padding(16)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    var accent: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(accent ? .black : .gray)
            Spacer()
            Text(value)
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(accent ? .black : .white)
            Text(title)
                .font(.system(size: 12))
                .foregroundColor(accent ? .black.opacity(0.6) : .gray)
        }
        .padding(16)
        .frame(maxWidth: .infinity, minHeight: 100, alignment: .leading)
        .background(accent ? Color.white : Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}

struct StatusRow: View {
    let label: String
    let status: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.7))
            Spacer()
            HStack(spacing: 6) {
                Circle()
                    .fill(Color.green)
                    .frame(width: 6, height: 6)
                Text(status)
                    .font(.system(size: 14))
                    .foregroundColor(.white)
            }
        }
    }
}
