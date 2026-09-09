import * as React from "react";
import { cn } from "@/lib/utils";
function Input({className,type,...props}:React.ComponentProps<"input">){return <input type={type} className={cn("h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base outline-none",className)} {...props}/>;}
export { Input };
