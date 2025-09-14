# Star Tracker

A mobile application built with Expo for astronomy enthusiasts to track celestial objects, align telescopes, and enhance stargazing experiences.

## Features

### Core Functionality
- **GPS Location Tracking**: Real-time GPS coordinates for accurate positioning
- **Compass Integration**: Built-in compass for precise directional guidance
- **Altitude Monitoring**: Altitude details for elevation-based calculations
- **Orientation Sensing**: Device orientation tracking for alignment purposes

### Target Management
- **Star Catalog**: Access to a comprehensive catalog of celestial targets
- **Manual Target Input**: Enter custom targets manually for flexibility
- **Target List**: Browse and select from available astronomical objects
- **Target Information**: Detailed information cards for selected targets

### Telescope Alignment
- **Alignment Mode**: Step-by-step telescope alignment process
- **Alt-Az Guidance**: Altitude-Azimuth coordinate system support
- **Sensor Overlay**: Visual overlays for precise alignment
- **Alignment Context**: Persistent alignment state management

### Observation Tools
- **Observe Mode**: Dedicated observation interface
- **Real-time Tracking**: Live updates for moving celestial objects
- **Location Status**: Current location and sensor status indicators
- **Observe Header**: Contextual information during observation

### User Interface
- **Tabbed Navigation**: Easy switching between alignment, observation, settings, and targets
- **Dark/Light Theme**: Adaptive color scheme based on device preferences
- **Responsive Design**: Optimized for both mobile platforms (iOS/Android)
- **Haptic Feedback**: Tactile responses for better user interaction

### Settings & Customization
- **Settings Management**: Configurable app preferences
- **Theme Customization**: Personalize the app appearance
- **Sensor Calibration**: Fine-tune device sensors for accuracy

## Getting Started

### Prerequisites
- Node.js
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Open the app in:
   - [Expo Go](https://expo.dev/go) for quick testing
   - Development build for full functionality
   - iOS Simulator or Android Emulator

## Project Structure

- `app/`: Main application screens and navigation
- `components/`: Reusable UI components
- `context/`: React context providers for state management
- `hooks/`: Custom React hooks
- `lib/`: Astronomy and orientation calculation utilities
- `constants/`: App constants and configuration
- `assets/`: Images and static assets

## Technologies Used

- **Expo**: Cross-platform mobile development framework
- **React Native**: Mobile UI framework
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **Device Sensors**: GPS, compass, and orientation APIs

## Screenshots

*Coming soon - Screenshots will be added to showcase the app's interface and features.*

## Technical Details

### Astronomy Calculations
The app utilizes astronomical algorithms in `lib/astro.ts` for:
- Celestial coordinate transformations
- Star position calculations
- Time-based astronomical computations

### Sensor Integration
Device sensors are managed through `lib/orientation.ts` and native Expo APIs for:
- GPS location services
- Magnetometer-based compass
- Accelerometer and gyroscope for orientation
- Altitude measurements

### State Management
Context providers handle application state:
- `alignment-context.tsx`: Telescope alignment state
- `settings-context.tsx`: User preferences and configuration
- `target-context.tsx`: Selected celestial targets and catalog data

## Build and Deployment

### Development Build
```bash
npx expo run:ios
npx expo run:android
```

### Production Build with EAS
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build for platforms
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Environment Setup
- Configure `app.json` and `eas.json` for build settings
- Set up environment variables in `.env` files
- Configure app icons and splash screens in `assets/`

## Troubleshooting

### Common Issues

**GPS/Location Permissions**
- Ensure location permissions are granted in device settings
- For iOS: Settings > Privacy & Security > Location Services
- For Android: Settings > Apps > Star Tracker > Permissions

**Compass Calibration**
- Calibrate device compass by moving in a figure-8 pattern
- Avoid magnetic interference from nearby electronics

**Sensor Accuracy**
- Ensure device sensors are functioning properly
- Restart the app if sensor readings appear incorrect
- Check for firmware updates on your device

**Build Issues**
- Clear Expo cache: `npx expo start --clear`
- Reset project: `npm run reset-project`
- Check Node.js and Expo versions compatibility

### Performance Tips
- Close other apps using GPS/compass sensors
- Use in open areas for better GPS accuracy
- Keep device battery charged for optimal sensor performance

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/star-tracker.git`
3. Install dependencies: `npm install`
4. Start development: `npx expo start`
5. Create a feature branch: `git checkout -b feature/your-feature-name`
6. Make your changes and test thoroughly
7. Submit a pull request

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex astronomical calculations
- Test on both iOS and Android platforms

### Reporting Issues
When reporting bugs, please include:
- Device model and OS version
- App version
- Steps to reproduce the issue
- Expected vs. actual behavior
- Any relevant error messages or logs

## Possible Future Changes

### Enhanced Catalog and Search
- **Expanded Celestial Catalog**: Add more astronomical objects including nebulae, galaxies, planets, and minor planets
- **Planetary Support**: Include detailed ephemeris data for all planets, dwarf planets, and major planetary moons with accurate position calculations
- **Advanced Search Functionality**: Implement search and filtering capabilities to quickly find targets by name, constellation, object type, or visibility
- **Dynamic Catalog Updates**: Support for online catalog updates and user-contributed target additions

### Performance Optimizations
- **Calculation Optimization**: Improve astronomical calculation algorithms for faster real-time tracking and reduced battery consumption
- **Enhanced Algorithms**: Implement more precise orbital mechanics, atmospheric refraction corrections, and precession calculations
- **Caching System**: Implement intelligent caching of frequently accessed astronomical data
- **Background Processing**: Optimize sensor data processing to minimize CPU usage

### Advanced Telescope Integration
- **Device-Telescope Orientation**: Track and compensate for the relative orientation between mobile device and telescope mount
- **Mount Type Support**: Add support for different telescope mount types (Alt-Az, Equatorial) with appropriate coordinate transformations
- **Offset Calibration**: Allow users to calibrate device position relative to telescope optical axis
- **Multi-Device Sync**: Support for using multiple devices simultaneously for complex alignments

### Astrophotography Support
- **Camera Integration**: Add support for connecting DSLR/mirrorless cameras for astrophotography guidance
- **Eyepiece/Camera Toggle**: Allow users to switch between visual observation (eyepiece) and photographic modes
- **Camera Settings Recommendations**: Provide suggested camera settings (ISO, shutter speed, aperture) based on target type, conditions, and equipment
- **Live View Integration**: Support for camera live view overlay with tracking guides

### Filter Management System
- **Comprehensive Filter Database**: Include all major filter types (broadband, narrowband, light pollution, planetary, etc.)
- **Filter Outcome Prediction**: Show expected results and image quality improvements for different filter-target combinations
- **Equipment Profile**: Allow users to save their telescope, camera, and filter combinations for quick setup
- **Filter Recommendations**: Suggest optimal filters based on target type and observing conditions

### Additional Features
- **Weather Integration**: Real-time weather data and astronomical seeing conditions
- **Observation Logging**: Track and log observations with notes, images, and conditions
- **Social Features**: Share observations and connect with other astronomy enthusiasts
- **Offline Mode**: Full functionality without internet connection for remote locations
- **AR Overlays**: Augmented reality features for naked-eye stargazing assistance
