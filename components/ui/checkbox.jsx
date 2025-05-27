import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Checkbox,
} from './YourComponentPath';

const ExampleForm = () => {
  return (
    <form>
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Checkbox id="option1" />
            <label htmlFor="option1">Option 1</label>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Checkbox id="option2" />
            <label htmlFor="option2">Option 2</label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </form>
  );
};

export default ExampleForm;