import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useCombobox, useMultipleSelection } from "downshift";

function DropdownMultipleCombobox({
  items,
  onSelectedItem,
  onRemoveSelectedItem,
}) {
  const [inputValue, setInputValue] = useState("");
  const {
    getSelectedItemProps,
    getDropdownProps,
    addSelectedItem,
    removeSelectedItem,
    selectedItems,
  } = useMultipleSelection({ initialSelectedItems: [] });
  const getFilteredItems = () =>
    items.filter(
      (item) =>
        selectedItems.indexOf(item) < 0 &&
        item.toLowerCase().startsWith(inputValue.toLowerCase())
    );
  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    inputValue,
    defaultHighlightedIndex: 0, // after selection, highlight the first item.
    selectedItem: null,
    items: getFilteredItems(),
    stateReducer: (state, actionAndChanges) => {
      const { changes, type } = actionAndChanges;
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: false, // keep the menu open after selection.
          };
      }
      return changes;
    },
    onStateChange: ({ inputValue, type, selectedItem }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(inputValue);
          break;
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          if (selectedItem) {
            setInputValue("");
            addSelectedItem(selectedItem);
            onSelectedItem(selectedItem);
          }
          break;
        default:
          break;
      }
    },
  });

  return (
    <div>
      <label
        className="uppercase font-bold text-gray-500 text-xs mb-2 block"
        {...getLabelProps()}
      >
        Choose some templates
      </label>
      <div className="relative">
        <div {...getComboboxProps()}>
          <input
            className="px-4 py-3 rounded-lg border block w-full outline-none focus:border-black"
            placeholder="Start typing..."
            {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
          />
          <button
            className="sr-only"
            {...getToggleButtonProps()}
            aria-label={"toggle menu"}
          >
            &#8595;
          </button>
        </div>
        <ul
          className={
            isOpen
              ? "absolute inset-x-0 bg-gray-100 rounded-lg p-5 mt-1 shadow-lg z-10 mb-10"
              : "sr-only"
          }
          style={{ top: "100%" }}
          {...getMenuProps()}
        >
          {isOpen &&
            getFilteredItems(items).map((item, index) => (
              <li
                className={[
                  "px-4 py-1 rounded",
                  highlightedIndex === index && "bg-gray-300",
                ].join(" ")}
                key={`${item}${index}`}
                {...getItemProps({ item, index })}
              >
                {item}
              </li>
            ))}
        </ul>
      </div>
      <div className="flex flex-wrap mt-5">
        {selectedItems.map((selectedItem, index) => (
          <span
            className="text-sm bg-gray-200 rounded-full px-2 py-1 m-1"
            key={`selected-item-${index}`}
            {...getSelectedItemProps({ selectedItem, index })}
          >
            {selectedItem}
            <span
              className="ml-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                removeSelectedItem(selectedItem);
                onRemoveSelectedItem(selectedItem);
              }}
            >
              &#10005;
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [result, setResult] = useState({
    error: null,
    loading: false,
    data: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setResult((result) => ({ ...result, loding: true }));
        const res = await fetch(
          "https://api.github.com/repos/toptal/gitignore/contents/templates"
        );
        const templates = await res.json();
        setResult((result) => ({ ...result, loading: false, data: templates }));
      } catch (error) {
        setResult((result) => ({ ...result, error: error.message }));
      }
    };

    fetchData();
  }, []);

  async function onSelectedItem(selectedItem) {
    setLoading(true);
    const template = result.data.find((t) => t.name === selectedItem);
    const res = await fetch(template.download_url);
    const text = await res.text();
    setSelectedItems([...selectedItems, { name: template.name, text }]);
    setLoading(false);
  }

  function onRemoveSelectedItem(selectedItem) {
    const templates = selectedItems.filter((i) => i.name !== selectedItem);
    setSelectedItems(templates);
  }

  return (
    <>
      <Head>
        <link
          href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Head>
      <main>
        <div className="container mx-auto px-5">
          <div className="lg:flex lg:justify-center mt-20">
            <div className="w-full lg:w-6/12">
              <h1 className="font-bold text-2xl mb-10">
                Gitignore as a Service (GaaS)
              </h1>
              {!!result.data.length && (
                <DropdownMultipleCombobox
                  items={result.data.map((item) => item.name)}
                  onSelectedItem={onSelectedItem}
                  onRemoveSelectedItem={onRemoveSelectedItem}
                />
              )}
            </div>
          </div>
          {!!result.data.length && (
            <pre className="rounded-lg p-5 mt-10 bg-black text-white overflow-x-auto w-full lg:mx-auto lg:w-2/3">
              {loading
                ? "Loading..."
                : !selectedItems.length
                ? "Choose a template"
                : selectedItems.map((template) => (
                    <div
                      key={template.name}
                    >{`\n\n##### ${template.name}\n\n${template.text}`}</div>
                  ))}
            </pre>
          )}
          <footer className="text-center text-gray-500 my-20">
            Made by{" "}
            <a
              className="underline"
              href="https://jesusferretti.now.sh"
              target="_blank"
            >
              Jesús Ferretti
            </a>{" "}
            <span className="mx-2">·</span>{" "}
            <a
              className="underline"
              href="https://github.com/jferrettiboke/gitignore-as-a-service"
              target="_blank"
            >
              Source code
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
