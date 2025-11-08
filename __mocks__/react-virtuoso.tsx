import React from "react";

type VirtuosoProps<T> = {
  data?: T[];
  totalCount?: number;
  itemContent?: (index: number, item: T) => React.ReactNode;
  components?: {
    List?: React.ForwardRefExoticComponent<
      React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
    >;
  };
  [key: string]: unknown;
};

export const Virtuoso = <T,>({
  data = [],
  itemContent,
  components,
}: VirtuosoProps<T>) => {
  const ListComponent = components?.List;
  const Wrapper = ListComponent
    ? ListComponent
    : React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
        ({ children, ...props }, ref) => (
          <div ref={ref} role="list" {...props}>
            {children}
          </div>
        )
      );

  const children = data.map((item, index) => {
    const rendered = itemContent ? itemContent(index, item) : null;
    if (React.isValidElement(rendered)) {
      return React.cloneElement(rendered, {
        key: (item as any)?.id ?? index,
      });
    }
    return (
      <div key={(item as any)?.id ?? index} role="listitem">
        {rendered}
      </div>
    );
  });

  return <Wrapper data-testid="virtuoso-mock">{children}</Wrapper>;
};

export type VirtuosoHandle = unknown;

export default Virtuoso;

