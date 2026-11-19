import React from "react";
import { Form, Select, Spin } from "antd";
import debounce from "lodash/debounce";

const { Option } = Select;

interface OptionType {
  label: string;
  value: any;
}

interface Props {
  options: OptionType[] | ((values: any) => OptionType[]) | any;
  onChange?: (value: any) => void;
  placeholder?: string;
  label?: string;
  name?: string;
  required?: boolean;
  // disabled?: boolean;
  disabled?: boolean | ((values: any) => boolean);
  notWrappedInForm?: boolean;
  value?: any;
  showSearch?: boolean;
  hasMore?: boolean;
  fetchMore?: () => void;
  isLoadingMore?: boolean;
  filterOption?: boolean | ((input: string, option: any) => boolean);
  onSearch?: (value: string) => void;
  searchLoading?: boolean;
}

const SingleSelectDropDown: React.FC<Props> = ({
  options,
  onChange,
  placeholder,
  label,
  name,
  required,
  disabled,
  notWrappedInForm,
  value,
  showSearch = false,
  fetchMore,
  hasMore = true,
  isLoadingMore = false,
  filterOption,
  onSearch,
  searchLoading = false,
}) => {
  const [isFetching, setIsFetching] = React.useState(false);
  const scrollLock = React.useRef(false);
  const form = Form.useFormInstance();

  const handlePopupScroll = React.useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      if (scrollLock.current) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const threshold = 100;

      if (!fetchMore || isLoadingMore || isFetching) return;

      if (scrollHeight - scrollTop - clientHeight <= threshold) {
        scrollLock.current = true;
        setIsFetching(true);

        try {
          await fetchMore();
        } finally {
          scrollLock.current = false;
          setIsFetching(false);
        }
      }
    },
    [fetchMore, hasMore, isLoadingMore, isFetching],
  );

  // Default filter option behavior if not provided
  const defaultFilterOption = (input: string, option: any) => {
    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  };

  const debouncedSearch = React.useMemo(() => {
    if (!onSearch) return undefined;
    return debounce((value) => {
      onSearch(value);
    }, 500);
  }, [onSearch]);

  const handleDropdownVisibleChange = React.useCallback(
    (open: boolean) => {
      if (open && debouncedSearch) {
        debouncedSearch.cancel();
        onSearch?.("");
      }
    },
    [onSearch, debouncedSearch],
  );

  const actualFilterOption = React.useMemo(() => {
    if (filterOption !== undefined) return filterOption;
    if (onSearch) return false;
    return showSearch ? defaultFilterOption : false;
  }, [filterOption, onSearch, showSearch]);

  const formValues = form?.getFieldsValue() || {};
  // const resolvedOptions =
  //   typeof options === "function" ? options(formValues) : options;

  const computedDisabled =
    typeof disabled === "function" ? disabled(formValues) : disabled;

  const select = (
    <Select
      style={{ width: "100%" }}
      value={value}
      onChange={onChange}
      allowClear={true}
      showSearch={showSearch}
      placeholder={placeholder}
      disabled={computedDisabled}
      listHeight={250}
      onPopupScroll={handlePopupScroll}
      filterOption={actualFilterOption}
      onSearch={debouncedSearch}
      onOpenChange={handleDropdownVisibleChange}
      loading={searchLoading}
      optionFilterProp="label"
      popupRender={(menu) => (
        <>
          {menu}
          {isLoadingMore && (
            <div style={{ textAlign: "center", padding: 8 }}>
              <Spin size="small" />
            </div>
          )}
        </>
      )}
    >
      {options?.map((option: any) => (
        <Option key={option.value} value={option.value} label={option.label}>
          {option.label}
        </Option>
      ))}
    </Select>
  );

  if (notWrappedInForm) return select;

  return (
    <Form.Item
      label={label}
      name={name}
      style={{ cursor: "pointer !important" }}
      rules={[{ required, message: `Please select an option` }]}
    >
      {select}
    </Form.Item>
  );
};

export default SingleSelectDropDown;
