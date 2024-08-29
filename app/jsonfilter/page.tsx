"use client";
import React, { useEffect, useCallback } from "react";
import ReactJson from "react-json-view";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { debounce } from "lodash-es";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      jsonInput: JSON.stringify({}, null, 2),
      parsedJSON: {},
      filters: "",
      filteredJSON: {},
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

const applyFilter = (data, filter) => {
  const paths = filter.split(".");

  const applyFilterRecursive = (current, pathIndex) => {
    if (pathIndex >= paths.length) return current;

    const path = paths[pathIndex];

    if (path === "*" && Array.isArray(current)) {
      return current.map((item) => applyFilterRecursive(item, pathIndex + 1));
    }

    if (path.includes(",")) {
      const fields = path.split(",");
      const result = {};
      fields.forEach((field) => {
        if (current && typeof current === "object" && field in current) {
          result[field] = current[field];
        }
      });
      return Object.keys(result).length > 0 ? result : undefined;
    }

    if (current && typeof current === "object" && path in current) {
      const result = applyFilterRecursive(current[path], pathIndex + 1);
      return result === undefined ? undefined : { [path]: result };
    }

    return undefined;
  };

  return applyFilterRecursive(data, 0);
};

const mergeResults = (results) => {
  const merge = (target, source) => {
    if (Array.isArray(source)) {
      return source.map((item, index) =>
        merge(Array.isArray(target) ? target[index] : undefined, item),
      );
    }
    if (source && typeof source === "object") {
      target = target || {};
      Object.keys(source).forEach((key) => {
        target[key] = merge(target[key], source[key]);
      });
      return target;
    }
    return source;
  };

  return results.reduce((acc, result) => merge(acc, result), {});
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
      try {
        const filterArray = filterString
          .split("\n")
          .filter((f) => f.trim() !== "");
        const filteredResults = filterArray
          .map((filter) => applyFilter(json, filter))
          .filter((result) => result !== undefined);

        if (filteredResults.length === 0) {
          setFilteredJSON({});
        } else {
          const mergedResult = mergeResults(filteredResults);
          setFilteredJSON(mergedResult);
        }
        setErrors([]);
      } catch (e) {
        setErrors(["Invalid JSON input or filter"]);
      }
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
    <div className="container flex flex-col h-full w-full">
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
              displayDataTypes={false}
              displayObjectSize={false}
              enableClipboard={false}
              collapsed={false}
              collapseStringsAfterLength={50}
              indentWidth={4}
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
