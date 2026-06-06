import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "square.grid.2x2")
                }
            
            JYSONView()
                .tabItem {
                    Label("JYSON", systemImage: "waveform")
                }
            
            CaptureView()
                .tabItem {
                    Label("Capture", systemImage: "plus.circle.fill")
                }
        }
        .tint(.white)
    }
}
