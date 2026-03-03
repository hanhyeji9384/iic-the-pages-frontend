// ============================================================
// Textarea 컴포넌트
// 여러 줄 텍스트를 입력받는 기본 UI 컴포넌트입니다.
// shadcn/ui 패턴을 따릅니다.
// ============================================================

import * as React from "react";
import { cn } from "./utils";

// 여러 줄 텍스트 입력 박스 컴포넌트
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // 기본 스타일: 크기 조절 불가, 테두리, 포커스 효과 등
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
