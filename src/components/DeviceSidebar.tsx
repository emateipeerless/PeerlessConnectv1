import { DEVICE_TABS } from '../config/devices';

type DeviceSidebarProps = {
  selectedDeviceId: number;
  onSelectDevice: (deviceId: number) => void;
};

export function DeviceSidebar({ selectedDeviceId, onSelectDevice }: DeviceSidebarProps) {
  return (
    <nav className="device-sidebar" aria-label="Device selection">
      <p className="device-sidebar__label">Devices</p>
      <ul className="device-sidebar__list">
        {DEVICE_TABS.map((tab) => {
          const isActive = tab.id === selectedDeviceId;
          return (
            <li key={tab.id}>
              <button
                type="button"
                className={`device-sidebar__tab ${isActive ? 'device-sidebar__tab--active' : ''}`}
                onClick={() => onSelectDevice(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="device-sidebar__tab-title">{tab.label}</span>
                <span className="device-sidebar__tab-subtitle">{tab.subtitle}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
