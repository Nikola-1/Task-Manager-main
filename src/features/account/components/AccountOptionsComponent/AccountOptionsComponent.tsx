import React, { useId, useState } from 'react'
import { useTheme, type UITheme } from '@/features/account/context/ThemeContext';
import { UserType } from "@/types/UserType";

interface AccountOptionsComponentProps {
    user: UserType | null;
    logout: () => void;
    visibleOptions?:boolean;
    setvisibleOptions:React.Dispatch<React.SetStateAction<boolean>>;
}
const AccountOptionsComponent = ({logout,visibleOptions,setvisibleOptions}: AccountOptionsComponentProps) => {
    const [themeOptionsVisible, setThemeOptionsVisible] = useState(false);
    const { theme, setTheme } = useTheme();
    const themeOptionsId = useId();
    


  return (
    <div>
      <ul>
        <li className='p-2 hover:bg-blue-300 hover:text-white rounded-md cursor-pointer' onClick={() => setvisibleOptions(!visibleOptions)}>Profile Settings</li>
        <li className='p-2 hover:bg-blue-300 hover:text-white rounded-md cursor-pointer'>Privacy Settings</li>
        <li>
          <button type="button" aria-expanded={themeOptionsVisible} aria-controls={themeOptionsId}
            className="w-full rounded-md p-2 text-left hover:bg-blue-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            onClick={() => setThemeOptionsVisible(current => !current)}>UI Theme</button>
          {themeOptionsVisible && <fieldset id={themeOptionsId} className="m-2 rounded-md border border-blue-300 p-3">
            <legend className="px-1 text-sm font-semibold">Choose UI theme</legend>
            <div className="flex flex-wrap gap-3">
              {([{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' }, { value: 'retro', label: 'Retro Game' }] satisfies { value: UITheme; label: string }[]).map(option =>
                <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-blue-100">
                  <input type="radio" name={themeOptionsId} value={option.value} checked={theme === option.value}
                    onChange={() => setTheme(option.value)} className="accent-blue-500" />
                  {option.label}
                </label>)}
              <button type="button" aria-pressed={theme === 'mario'} onClick={() => setTheme('mario')}
                className="mario-theme-button border-2 border-red-700 bg-red-600 px-3 py-2 text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
                Super Mario
              </button>
            </div>
            {theme === 'retro' && <p className="mt-2 text-sm">Retro Game: pixel lettering, arcade colors and classic game panels.</p>}
            {theme === 'mario' && <p className="mt-2 text-sm">Super Mario: blue skies, red buttons, green pipes and golden blocks.</p>}
            <p className="mt-2 text-sm">Applied immediately and saved in this browser. System follows your device settings.</p>
          </fieldset>}
        </li>
        <li className='p-2 hover:bg-blue-300 hover:text-white rounded-md cursor-pointer' onClick={() => logout()}>Logout</li>    
      </ul>
    </div>
  )
}

export default AccountOptionsComponent

