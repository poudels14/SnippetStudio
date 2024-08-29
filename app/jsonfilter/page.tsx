"use client";
import React, { useEffect, useCallback } from "react";
import ReactJson from "react-json-view";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { debounce } from "lodash-es";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const defaultJSON = {};

interface AppState {
  jsonInput: string;
  parsedJSON: any;
  filters: string;
  filteredJSON: any;
  errors: string[];
  setJsonInput: (input: string) => void;
  setFilters: (filters: string) => void;
  setFilteredJSON: (json: any) => void;
  setErrors: (errors: string[]) => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      jsonInput: JSON.stringify(defaultJSON, null, 2),
      parsedJSON: defaultJSON,
      filters: "",
      filteredJSON: defaultJSON,
      errors: [],
      setJsonInput: (input) =>
        set((state) => {
          try {
            const parsed = JSON.parse(input);
            return { jsonInput: input, parsedJSON: parsed, errors: [] };
          } catch (error) {
            return {
              jsonInput: input,
              errors: ["Invalid JSON: Please check your input"],
            };
          }
        }),
      setFilters: (filters) => set({ filters }),
      setFilteredJSON: (json) => set({ filteredJSON: json }),
      setErrors: (errors) => set({ errors }),
    }),
    {
      name: "snippetstudio/jsonfilter",
      getStorage: () => localStorage,
    },
  ),
);

const filterJSON = (
  json: any,
  filters: string[],
): { result: any; errors: string[] } => {
  if (filters.length === 0) {
    return { result: json, errors: [] };
  }

  const result: any = {};
  const errors: string[] = [];

  const applyFilter = (obj: any, filter: string, target: any) => {
    const parts = filter.split(".");
    let current = obj;
    let currentTarget = target;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === "*" && Array.isArray(current)) {
        current.forEach((item, index) => {
          if (!currentTarget[index]) currentTarget[index] = {};
          applyFilter(item, parts.slice(i + 1).join("."), currentTarget[index]);
        });
        return;
      } else if (current && typeof current === "object" && part in current) {
        if (i === parts.length - 1) {
          currentTarget[part] = current[part];
        } else {
          currentTarget[part] = Array.isArray(current[part]) ? [] : {};
          current = current[part];
          currentTarget = currentTarget[part];
        }
      } else {
        errors.push(`Invalid filter: ${filter}`);
        return;
      }
    }
  };

  filters.forEach((filter) => applyFilter(json, filter, result));
  return { result, errors };
};

export default function Component() {
  const {
    jsonInput,
    parsedJSON,
    filters,
    filteredJSON,
    errors,
    setJsonInput,
    setFilters,
    setFilteredJSON,
    setErrors,
  } = useAppStore();

  const applyFilters = useCallback(
    debounce((filterString: string, json: any) => {
      const filterArray = filterString
        .split("\n")
        .filter((f) => f.trim() !== "");
      const { result, errors } = filterJSON(json, filterArray);
      setFilteredJSON(result);
      setErrors(errors);
    }, 300),
    [],
  );

  useEffect(() => {
    applyFilters(filters, parsedJSON);
  }, [filters, parsedJSON, applyFilters]);

  const handleJsonInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setJsonInput(event.target.value);
  };

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setFilters(event.target.value);
  };

  return (
    <div className="container mx-auto flex flex-col h-full">
      <div className="w-full flex-1 flex space-x-4 overflow-hidden">
        <div className="flex-1 flex flex-col space-y-2">
          <label htmlFor="json-input" className="font-medium">
            Enter JSON:
          </label>
          <ScrollArea className="h-full">
            <Textarea
              id="json-input"
              value={jsonInput}
              onChange={handleJsonInputChange}
              className="flex-1 w-full h-full min-h-[400px] font-mono text-sm resize-none"
              placeholder="Enter your JSON here..."
              aria-describedby="json-input-description"
            />
          </ScrollArea>
          <p
            id="json-input-description"
            className="text-sm text-muted-foreground"
          >
            Enter valid JSON to filter. The app will update as you type.
          </p>
        </div>
        <div className="flex-1 flex flex-col border rounded-lg bg-background">
          <h2 className="px-2 py-1 text-base font-semibold">Result</h2>
          <ScrollArea className="overflow-scroll">
            <ReactJson
              src={filteredJSON}
              theme="twilight"
              displayDataTypes={false}
              displayObjectSize={false}
              enableClipboard={false}
              collapsed={false}
              collapseStringsAfterLength={50}
              indentWidth={2}
              name={null}
            />
          </ScrollArea>
        </div>
      </div>
      {errors.length > 0 && (
        <Alert variant="destructive" className="my-4">
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      <div className="mt-4 space-y-2">
        <label htmlFor="filters" className="block font-medium">
          Enter filters (one per line):
        </label>
        <Textarea
          id="filters"
          value={filters}
          onChange={handleFilterChange}
          placeholder="Enter filters here (e.g., id&#10;ruleset_links.*.id)"
          className="w-full h-32"
          aria-describedby="filter-description"
        />
        <p id="filter-description" className="text-sm text-muted-foreground">
          Filters are applied automatically as you type. Use dot notation for
          nested fields and * for array items. Leave empty to see the full JSON.
        </p>
      </div>
    </div>
  );
}
