/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {FlipperPlugin, FlipperDevicePlugin} from './plugin';
import {showOpenDialog} from './utils/exportData';
import {setSelectPluginsToExportActiveSheet} from './reducers/application';
import {Store} from './reducers/';
import electron, {MenuItemConstructorOptions} from 'electron';
import constants from './fb-stubs/constants';
import os from 'os';
import path from 'path';

export type DefaultKeyboardAction = 'clear' | 'goToBottom' | 'createPaste';
export type TopLevelMenu = 'Edit' | 'View' | 'Window' | 'Help';
const {dialog} = electron.remote;

export type KeyboardAction = {
  action: string;
  label: string;
  accelerator?: string;
  topLevelMenu: TopLevelMenu;
};

const defaultKeyboardActions: Array<KeyboardAction> = [
  {
    label: 'Clear',
    accelerator: 'CmdOrCtrl+K',
    topLevelMenu: 'View',
    action: 'clear',
  },
  {
    label: 'Go To Bottom',
    accelerator: 'CmdOrCtrl+B',
    topLevelMenu: 'View',
    action: 'goToBottom',
  },
  {
    label: 'Create Paste',
    topLevelMenu: 'Edit',
    action: 'createPaste',
  },
];

export type KeyboardActions = Array<DefaultKeyboardAction | KeyboardAction>;

const menuItems: Map<string, electron.MenuItem> = new Map();

let pluginActionHandler;
function actionHandler(action: string) {
  if (pluginActionHandler) {
    pluginActionHandler(action);
  } else {
    console.warn(`Unhandled keyboard action "${action}".`);
  }
}

export function setupMenuBar(
  plugins: Array<typeof FlipperPlugin | typeof FlipperDevicePlugin>,
  store: Store,
) {
  const template = getTemplate(
    electron.remote.app,
    electron.remote.shell,
    store,
  );
  // collect all keyboard actions from all plugins
  const registeredActions: Set<KeyboardAction> = new Set(
    plugins
      .map(plugin => plugin.keyboardActions || [])
      .reduce((acc: KeyboardActions, cv) => acc.concat(cv), [])
      .map((action: DefaultKeyboardAction | KeyboardAction) =>
        typeof action === 'string'
          ? defaultKeyboardActions.find(a => a.action === action)
          : action,
      ),
  );

  // add keyboard actions to
  registeredActions.forEach(keyboardAction => {
    if (keyboardAction != null) {
      appendMenuItem(template, actionHandler, keyboardAction);
    }
  });

  // create actual menu instance
  const applicationMenu = electron.remote.Menu.buildFromTemplate(template);

  // add menu items to map, so we can modify them easily later
  registeredActions.forEach(keyboardAction => {
    if (keyboardAction != null) {
      const {topLevelMenu, label, action} = keyboardAction;
      const menu = applicationMenu.items.find(
        menuItem => menuItem.label === topLevelMenu,
      );
      if (menu) {
        // $FlowFixMe submenu is missing in electron API spec
        const menuItem = menu.submenu.items.find(
          menuItem => menuItem.label === label,
        );
        menuItems.set(action, menuItem);
      }
    }
  });

  // update menubar
  electron.remote.Menu.setApplicationMenu(applicationMenu);
}

function appendMenuItem(
  template: Array<MenuItemConstructorOptions>,
  actionHandler: (action: string) => void,
  item: KeyboardAction,
) {
  const keyboardAction = item;
  if (keyboardAction == null) {
    return;
  }
  const itemIndex = template.findIndex(
    menu => menu.label === keyboardAction.topLevelMenu,
  );
  if (itemIndex > -1 && template[itemIndex].submenu != null) {
    (template[itemIndex].submenu as MenuItemConstructorOptions[]).push({
      click: () => actionHandler(keyboardAction.action),
      label: keyboardAction.label,
      accelerator: keyboardAction.accelerator,
      enabled: false,
    });
  }
}

export function activateMenuItems(
  activePlugin:
    | FlipperPlugin<any, any, any>
    | FlipperDevicePlugin<any, any, any>,
) {
  // disable all keyboard actions
  for (const item of menuItems) {
    item[1].enabled = false;
  }

  // set plugin action handler
  if (activePlugin.onKeyboardAction) {
    pluginActionHandler = activePlugin.onKeyboardAction;
  }

  // enable keyboard actions for the current plugin
  if (activePlugin.constructor.keyboardActions != null) {
    (activePlugin.constructor.keyboardActions || []).forEach(keyboardAction => {
      const action =
        typeof keyboardAction === 'string'
          ? keyboardAction
          : keyboardAction.action;
      const item = menuItems.get(action);
      if (item != null) {
        item.enabled = true;
      }
    });
  }

  // set the application menu again to make sure it updates
  electron.remote.Menu.setApplicationMenu(
    electron.remote.Menu.getApplicationMenu(),
  );
}

function getTemplate(
  app: electron.App,
  shell: electron.Shell,
  store: Store,
): Array<MenuItemConstructorOptions> {
  const exportSubmenu = [
    {
      label: 'File...',
      accelerator: 'CommandOrControl+E',
      click: function() {
        dialog.showSaveDialog(
          null,
          {
            title: 'FlipperExport',
            defaultPath: path.join(os.homedir(), 'FlipperExport.flipper'),
          },
          async file => {
            if (!file) {
              return;
            }
            store.dispatch(
              setSelectPluginsToExportActiveSheet({type: 'file', file: file}),
            );
          },
        );
      },
    },
  ];
  if (constants.ENABLE_SHAREABLE_LINK) {
    exportSubmenu.push({
      label: 'Sharable Link',
      accelerator: 'CommandOrControl+Shift+E',
      click: function() {
        store.dispatch(setSelectPluginsToExportActiveSheet({type: 'link'}));
      },
    });
  }

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CommandOrControl+O',
          click: function() {
            showOpenDialog(store);
          },
        },
        {
          label: 'Export',
          submenu: exportSubmenu,
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: function(
            _,
            focusedWindow: electron.BrowserWindow | undefined,
          ) {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: (function() {
            if (process.platform === 'darwin') {
              return 'Ctrl+Command+F';
            } else {
              return 'F11';
            }
          })(),
          click: function(
            _,
            focusedWindow: electron.BrowserWindow | undefined,
          ) {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: (function() {
            if (process.platform === 'darwin') {
              return 'Alt+Command+I';
            } else {
              return 'Ctrl+Shift+I';
            }
          })(),
          click: function(
            _,
            focusedWindow: electron.BrowserWindow | undefined,
          ) {
            if (focusedWindow) {
              // @ts-ignore: https://github.com/electron/electron/issues/7832
              focusedWindow.toggleDevTools();
            }
          },
        },
        {
          type: 'separator',
        },
      ],
    },
    {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize',
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close',
        },
      ],
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Getting started',
          click: function() {
            shell.openExternal(
              'https://fbflipper.com/docs/getting-started.html',
            );
          },
        },
        {
          label: 'Create plugins',
          click: function() {
            shell.openExternal(
              'https://fbflipper.com/docs/tutorial/intro.html',
            );
          },
        },
        {
          label: 'Report problems',
          click: function() {
            shell.openExternal('https://github.com/facebook/flipper/issues');
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    const name = app.getName();
    template.unshift({
      label: name,
      submenu: [
        {
          label: 'About ' + name,
          role: 'about',
        },
        {
          type: 'separator',
        },
        {
          label: 'Services',
          role: 'services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          label: 'Hide ' + name,
          accelerator: 'Command+H',
          role: 'hide',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers',
        },
        {
          label: 'Show All',
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() {
            app.quit();
          },
        },
      ],
    });
    const windowMenu = template.find(function(m) {
      return m.role === 'window';
    });
    if (windowMenu) {
      (windowMenu.submenu as MenuItemConstructorOptions[]).push(
        {
          type: 'separator',
        },
        {
          label: 'Bring All to Front',
          role: 'front',
        },
      );
    }
  }

  return template;
}
