'use client';

import { BellIcon, Cookie, CreditCard, Inbox, MessageSquare, Settings, User } from "lucide-react";
import { Command, CommandGroup, CommandItem, CommandList } from "./ui/command";
import UserItem from "./UserItem";
import Image from "next/image";


export default function Sidebar() {
  const menuList = [
    {
      group: "General",
      items: [
        {
          link: "/",
          icon: <User />,
          text: "Profile"
        },
        {
          link: "/",
          icon: <Inbox />,
          text: "Inbox"
        },
        {
          link: "/",
          icon: <CreditCard />,
          text: "Billing"
        },
        {
          link: "/",
          icon: <BellIcon />,
          text: "Notifications"
        }
      ]
    },
    {
      group: "Settings",
      items: [
        {
          link: "/",
          icon: <Settings />,
          text: "General Settings"
        },
        {
          link: "/",
          icon: <Cookie />,
          text: "Privacy"
        },
        {
          link: "/",
          icon: <MessageSquare />,
          text: "Logs"
        }
      ]
    }
  ]

  return <div className="fixed flex flex-col gap-4 w-[300px] min-w-[300px] border-r min-h-screen p-4">
    <div>
      <UserItem />
    </div>
    <div className="grow">
      <Command style={{ overflow: 'visible' }}>
        <CommandList style={{ overflow: 'visible' }}>
          {menuList.map((menu: any, key: number) => (
            <CommandGroup key={key} heading={menu.group}>
              {menu.items.map((option: any, optionKey: number) =>
                <CommandItem key={optionKey} className="flex gap-2 cursor-pointer">
                  {option.icon}
                  {option.text}
                </CommandItem>
              )}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>

    </div>
    <Image
          className="dark:invert"
          src="/images/tens logo-blue.png"
          alt="Next.js logo"
          width={100}
          height={38}
          priority
        />
    <Image
          className="dark:invert"
          src="/images/Mascott Tens@300x.png"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
    <Image
          className="dark:invert"
          src="/images/tens logo booth.png"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
    <div>Settings / Notifications</div>
  </div>;
}